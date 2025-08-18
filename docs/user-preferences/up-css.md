<!--
  Series name: User Preferences
  Series file prefix: up
  File name: up-css.md
-->

# User Preferences

## Context

This codebase is being developed to meet the needs of a single specific client using the latest version of the Vivaldi browser in a Windows 10/11 OS.

## This client prefers:

1. a light rather than dark mode
1. a straightforward black foreground against a white background
1. a visually uncluttered UI
   - options should almost always be displayed in large font dropdown lists rather than a set of always-visible icons
   - toolbars, search bars, and other such seldom-used elements should usually be hidden by default, and triggered by colored hot-spots (e.g. use a set of three, differently colored `margin: 0; height: 20px;` at at the top edge of the screen to trigger the display of Search, Zoom and User Preference panes)
1. All text:
   - `font-family: Verdana, Geneva, Tahoma, sans-serif;`
   - `color: black;`
   - `background-color: white;`
   - `font-weight: 600;`
1. Font sizes:
   - Paragraph (and similar) text for general reading: 48px
   - Single-line, short-lived, and/or predictable text (for titles, context menu items like "Delete", tooltips, etc.):
     - Optimal: 38px
     - Usable: 32px
1. Hover highlighting effects:
   - The element should have a solid transparent 3px border.
   - Hovering the element should colorize the transparent border.
   - The hovered border color should be red or blue unless otherwise requested.
1. `border-radius: 0;`
1. Buttons and Icons:
   - The client:
     - mainly distinguishes these elements by color and position
     - generally cannot perceive the shape of icons
   - Strategies:
     - many complex icon sets convey little information and can be hidden completely
     - where icons/buttons must be used for control purposes, use differently colored boxes and provide tooltips
1. Information elements (e.g. counters, state info, etc.) should be hidden by default and displayed on hover (counters/etc.), or as transient (large font) screen notifications

## This client hates:

1. gradients of any kind
1. all box shadows and other elements intended to provide subtle visual transitions between page elements

## Screen Reader

This client does not use a screen reader.

Although important, ARIA or other screen reader functionality is neither required nor desirable at this stage of the developmental process
