import { extendTheme } from "@chakra-ui/react";

const fonts = { mono: `'Menlo', monospace` };

const breakpoints = {
  sm: "40em",
  md: "52em",
  lg: "64em",
  xl: "80em",
};

const todoTheme = extendTheme({
  semanticTokens: {
    colors: {
      text: {
        default: "#16161D",
        _dark: "#ade3b8",
      },
      annCardBackground: {
        default: "#16161D",
        _dark: "#ade3b8",
      },
      answerBackground: {
        default: "#ff00f0",
        _dark: "#ff00f0",
      },
      createRightColumn: {
        default: "#16161D",
        _dark: "#ade3b8",
      },
    },
    radii: {
      button: "12px",
    },
  },
  colors: {
    black: "#16161D",
  },
  fonts,
  breakpoints,
});

export default todoTheme;
