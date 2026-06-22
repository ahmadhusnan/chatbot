---
name: generate_pptx
description: Generate beautifully styled PowerPoint presentations (.pptx) programmatically using Python and a slide schema.
---

# PowerPoint/PPTX Generation Skill

This skill allows the agent to generate modern, clean, and professional PowerPoint (.pptx) presentations based on slide schemas and official design guidelines.

## Triggering the Skill
This skill is triggered when you ask the agent to create, generate, outline, or export a PowerPoint presentation or slide deck.

## Execution Guide
1. **State Your Approach**: Before compiling a presentation, state your content-informed design approach (colors, typography, layout choices) in the chat.
2. **Draft a Slide Schema**: Define the presentation in a JSON file matching the schema properties below.
3. **Execute Compiler**: Run the built-in [generate_pptx.py](file:///C:/Users/ahmad/Repo%20MTI/chatbot/.agents/skills/generate_pptx/scripts/generate_pptx.py) Python utility by passing the schema path and target output path.
4. **Deliver Presentation**: Confirm the file is built successfully and let the user know where it is located.

---

## Schema Reference

### Theme Properties (`theme`)
- `fontName`: Web-safe font choice (`"Arial"`, `"Trebuchet MS"`, `"Georgia"`, `"Calibri"`, `"Verdana"`, `"Tahoma"`).
- `palette`: Select one of the 18 design presets:
  - `"classic_blue"`: Deep navy / slate / off-white
  - `"teal_coral"`: Teal / coral / white
  - `"bold_red"`: Red / orange / yellow
  - `"warm_blush"`: Mauve / rose / cream
  - `"burgundy_luxury"`: Burgundy / rust / gold
  - `"deep_purple_emerald"`: Dark base / purple / emerald
  - `"cream_forest_green"`: Forest green / cream / white
  - `"pink_purple"`: Purple base / pink / rose
  - `"lime_plum"`: Blue-gray base / plum / lime
  - `"black_gold"`: Gold / black / cream
  - `"sage_terracotta"`: Sage / terracotta / cream
  - `"charcoal_red"`: Charcoal / red / light gray
  - `"vibrant_orange"`: Orange / gray / charcoal
  - `"forest_green"`: Dark green / green / white
  - `"retro_rainbow"`: Purple / orange / gold
  - `"vintage_earthy"`: Mustard / forest green / cream
  - `"coastal_rose"`: Old rose / eggshell / gray
  - `"orange_turquoise"`: Turquoise / orange / white
- `backgroundColor` / `textColor` / `primaryColor` / `secondaryColor`: (Optional) Overrides if `palette` is not used.

### Slide Properties (`slides[]`)
- `type`: `'title'` | `'header'` | `'content'` | `'two_columns'`.
- `title`: Slide heading.
- `subtitle`: (For `title` type) Subtitle text.
- `underlineAccent`: Boolean (default `true`) to add a colored secondary accent underline beneath headings.
- `bullets[]`: (For `content` type) Array of slide points.
- `split`: (For `two_columns` type) Column split width ratios: `"50_50"`, `"30_70"`, `"40_60"`, `"60_40"`, `"70_30"`.
- `leftColumn` / `rightColumn`: (For `two_columns` type) Column layout objects:
  ```json
  {
    "title": "Column Title",
    "bullets": ["Point A", "Point B"]
  }
  ```

---

## Usage

```bash
python .agents/skills/generate_pptx/scripts/generate_pptx.py --schema path/to/schema.json --output path/to/presentation.pptx
```
