const id = "DEAB22_COLOR_AVATAR";
const groups = ["Deab22's Plugins", "EVENT_GROUP_DIALOGUE"];
const name = "Display Dialogue (Color Avatar)";

const MAX_OPTIONS = 16;

const MAX_DIALOGUE_LINES = 2;

const wrap8Bit = (val) => (256 + (val % 256)) % 256;

const decOct = (dec) => wrap8Bit(dec).toString(8).padStart(3, "0");

const setTextPos = (x, y) => `\\003\\${decOct(x)}\\${decOct(y)}`;
const writeAsciiChar = (char) => `\\005\\${decOct(char)}`;
const waitforInputMask = (mask) => `\\006\\${decOct(mask)}`;

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
    _overlayClear,
    _overlayMoveTo,
    _overlayWait,
    _loadStructuredText,
    _displayText,
    _idle,
    paletteSetSprite,
  } = helpers;



  _addComment("Avatar dialogue");

  //Make sprites appear on overlay
  appendRaw(`VM_PUSH_CONST 0
VM_GET_UINT8 .ARG0, _overlay_priority
VM_SET_CONST_UINT8 _overlay_priority, 0
VM_SET_CONST_UINT8 _show_actors_on_overlay, 1`);


  _overlayClear(0, 0, 20, MAX_DIALOGUE_LINES + 2, ".UI_COLOR_BLACK", true);
  _overlayMoveTo(0, 18 - MAX_DIALOGUE_LINES - 2, ".OVERLAY_IN_SPEED");

  Array(input.items)
    .fill()
    .map((_, i) => {//For every character:
      const idx = i + 1;
      const avatar = input[`item_${idx}_avatar`];
      
      //Update and show Avatar
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
      _addNL();
      _addComment(`Character ${idx}:`);
      
      textArray.forEach((text, textIndex) => {//For every text box:

        //Add scrolling text code to string
        const linearray = text.split("\n");
        let newText = "";
        linearray.forEach((line, lineIndex) => {//For every line of text:
          newText += line;
          if(linearray.length > 2 && lineIndex % 2 && lineIndex != linearray.length - 1){
            newText += setTextPos(18, 4) + writeAsciiChar(127) + waitforInputMask(48);
            newText += setTextPos(18, 4) + writeAsciiChar(143);
            if(avatar) newText += setTextPos(5, 2);
            else newText += setTextPos(2, 2);
            newText += `\n\n`;
          }else{
            if(lineIndex != linearray.length - 1) newText += `\n`;
          }
        });
        text = newText;

        if(avatar){
          text = setTextPos(5, 2) + text;
        }
        //Add indicator arrow
        if (!(textIndex === textArray.length - 1 && idx === input.items)) {
          text += setTextPos(18, 4) + writeAsciiChar(127);
        }
        //Load and write text
        _addComment(`Text box ${textIndex + 1}`);
        _loadStructuredText(text, undefined, MAX_DIALOGUE_LINES);
        _overlayClear(0, 0, 20, MAX_DIALOGUE_LINES + 2, ".UI_COLOR_BLACK", true);
        _displayText();
        _overlayWait(true, [
          ".UI_WAIT_WINDOW",
          ".UI_WAIT_TEXT",
          ".UI_WAIT_BTN_A",
        ]);
        _addNL();
      });
      _addNL();
      })(input[`item_${idx}_text`] || " ");

      if(avatar){
        actorHide(input.actor);
      }

    });
  
  //Close text and reset all vars
  _overlayMoveTo(0, 18, ".OVERLAY_OUT_SPEED");
  _overlayWait(true, [".UI_WAIT_WINDOW", ".UI_WAIT_TEXT"]);

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
