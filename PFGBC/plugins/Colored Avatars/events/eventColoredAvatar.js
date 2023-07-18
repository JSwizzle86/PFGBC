const id = "DEAB22_COLOR_AVATAR";
const groups = ["Deab22's Plugins", "EVENT_GROUP_DIALOGUE"];
const name = "Display Dialogue (Color Avatar)";

const MAX_OPTIONS = 16;

const MAX_DIALOGUE_LINES = 2;

const wrap8Bit = (val) => (256 + (val % 256)) % 256;

const decOct = (dec) => wrap8Bit(dec).toString(8).padStart(3, "0");

const fields = [].concat(
  {
    key: "items",
    type: "number",
    label: "Number of Text thingies",
    defaultValue: 1,
    min: 1,
    max: MAX_OPTIONS,
    width: "50%",
  },
  {
    key: "actor",
    type: "actor",
    label: "UI Actor",
    defaultValue: "$self$",
    width: "50%",
  },

  ...Array(MAX_OPTIONS)
    .fill()
    .reduce((arr, _, i) => {
      const idx = i + 1;
      arr.push(
        {
          type: "break",
          conditions: [
            {
              key: "items",
              gte: idx,
            }
          ],
        },
        {
          label: " ",
          conditions: [
            {
              key: "items",
              gte: idx,
            }
          ],
        },
        {
          key: `item_${idx}_avatar`,
          label: "Use Avatar?",
          type: "checkbox",
          width: "50%",
          conditions: [
            {
              key: "items",
              gte: idx,
            },
          ],
        },
        {
        type: "break",
          conditions: [
            {
              key: "items",
              gte: idx,
            }
          ],
        },
        {
          key: `item_${idx}_sprite`,
          label: `Spritesheet`,
          type: "sprite",
          defaultValue: "LAST_SPRITE",
          width: "50%",
          conditions: [
            {
              key: "items",
              gte: idx,
            },
            {
              key: `item_${idx}_avatar`,
              eq: true,
            },
          ],
        },
        {
          key: `item_${idx}_pallete`,
          label: `Pallete`,
          type: "palette",
          defaultValue: "keep",
          paletteType: "sprite",
          paletteIndex: 7,
          canKeep: true,
          width: "50%",
          conditions: [
            {
              key: "items",
              gte: idx,
            },
            {
              key: `item_${idx}_avatar`,
              eq: true,
            },
          ],
        },
        {
          key: `item_${idx}_text`,
          type: "textarea",
          label: `Text:`,
          placeholder: `Text...`,
          defaultValue: "",
          flexBasis: "100%",
          multiple: true,
          conditions: [
            {
              key: "items",
              gte: idx,
            },
          ],
        },

      );
      return arr;
    }, []),
);

const compile = (input, helpers) => {
  const {
    actorSetActive,
    actorSetPosition,
    actorSetSprite,
    actorShow,
    actorHide,
    _addComment,
    _addNL,
    appendRaw,
    _overlayWait,
    _idle,
    paletteSetSprite,
  } = helpers;


  _addComment("Avatar dialogue");

  appendRaw(`VM_PUSH_CONST 0
VM_GET_UINT8 .ARG0, _overlay_priority
VM_SET_CONST_UINT8 _overlay_priority, 0
VM_SET_CONST_UINT8 _show_actors_on_overlay, 1`);

  helpers._overlayClear(0, 0, 20, MAX_DIALOGUE_LINES + 2, ".UI_COLOR_BLACK", true);
  helpers._overlayMoveTo(0, 14, ".OVERLAY_IN_SPEED");

  Array(input.items)
    .fill()
    .map((_, i) => {
      const idx = i + 1;
      const avatar = input[`item_${idx}_avatar`];
      
      if(avatar){
        paletteSetSprite(["keep","keep","keep","keep","keep","keep","keep", input[`item_${idx}_pallete`]]);
        actorSetActive(input.actor);
        actorSetPosition(1, 17, "tiles");
        actorSetSprite(input[`item_${idx}_sprite`]);
        _overlayWait(true, [".UI_WAIT_WINDOW"]);
        _idle();
        actorShow(input.actor);
      }
      
      ((inputText = " ") => {
      const textArray = Array.isArray(inputText) ? inputText : [inputText];

      const initialNumLines = textArray.map(
        (textBlock) => textBlock.split("\n").length
      );

      const maxNumLines = Math.max(2, Math.max.apply(null, initialNumLines));
      const textBoxHeight = MAX_DIALOGUE_LINES + 2;
      const textBoxY = 18 - textBoxHeight;

      helpers._addComment("Text Dialogue");
      textArray.forEach((text, textIndex) => {
        
        if(avatar){
          text = `\\003\\005\\002` + text;
        }
        if (!(textIndex === textArray.length - 1 && idx === input.items)) {
          text = text + `\\003\\022\\004\\005\\177`;
        }
        let avatarIndex = undefined;

        helpers._loadStructuredText(text, avatarIndex, MAX_DIALOGUE_LINES);
        helpers._overlayClear(0, 0, 20, textBoxHeight, ".UI_COLOR_BLACK", true);
        helpers._displayText();
        helpers._overlayWait(true, [
          ".UI_WAIT_WINDOW",
          ".UI_WAIT_TEXT",
          ".UI_WAIT_BTN_A",
        ]);
      });
      helpers._addNL();
      })(input[`item_${idx}_text`] || " ");

      if(avatar){
        actorHide(input.actor);
      }

    });

  helpers._overlayMoveTo(0, 18, ".OVERLAY_OUT_SPEED");
  helpers._overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);

  appendRaw(`VM_SET_UINT8 _overlay_priority, .ARG0
VM_POP 1
VM_SET_CONST_UINT8 _show_actors_on_overlay, 0`);

  _addNL();

};


module.exports = {
  id,
  name,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
