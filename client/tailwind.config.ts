import { fontFamily } from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import { Config } from "tailwindcss/types/config";
type Hsla = `hsla(${number}, ${number}%, ${number}%, ${number})`;
type HslaOption = {
  hue?: number | ((hue: number) => number);
  sat?: number | ((sat: number) => number);
  light?: number | ((light: number) => number);
  alpha?: number | ((alpha: number) => number);
};

const hslaRegex =
  /^hsla\(\s*(?<hue>3[0-5][0-9]|[0-2]?[0-9]{1,2})\s*,\s*(?<sat>100|[0-9]{1,2})%\s*,\s*(?<light>100|[0-9]{1,2})%\s*,\s*(?<alpha>1|0\.\d+)\)$/;

/**
 * @example
 * calcHsla('hsla(0, 0%, 0%, 1)', { alpha: 0.5 })
 * calcHsla('hsla(0, 0%, 0%, 1)', { alpha: p => p - 0.5 })
 * hsla(0, 0%, 0%, 0.5)
 */
function calcHsla(hsla: Hsla, options?: HslaOption) {
  const matched = hsla.match(hslaRegex);
  if (!matched?.groups) return hsla;

  const { hue, sat, light, alpha } = matched.groups;
  const calcHue =
    typeof options?.hue === "function"
      ? options.hue(Number(hue))
      : options?.hue ?? Number(hue);
  const calcSat =
    typeof options?.sat === "function"
      ? options.sat(Number(sat))
      : options?.sat ?? Number(sat);
  const calcLight =
    typeof options?.light === "function"
      ? options.light(Number(light))
      : options?.light ?? Number(light);
  const calcAlpha =
    typeof options?.alpha === "function"
      ? options.alpha(Number(alpha))
      : options?.alpha ?? Number(alpha);

  const getToFixed = (value: number) => value.toFixed(2);

  return `hsla(${getToFixed(calcHue)}, ${getToFixed(calcSat)}%, ${getToFixed(
    calcLight
  )}%, ${getToFixed(calcAlpha)})`;
}

/**
 * TailwindCSS Config의 colors를 CSS Variables로 나타내줍니다.
 * @example
 * extractColorVars(theme('colors'))
 * :root {
 *  --color-black: hsla(0, 0%, 0%, 1);
 * }
 */
function extractColorVars(
  colorObj: Config,
  colorGroup = ""
): Record<string, string> {
  return Object.keys(colorObj).reduce<Record<string, string>>(
    (vars, colorKey) => {
      const value = colorObj[colorKey];
      const cssVariable =
        colorKey === "DEFAULT"
          ? `--color${colorGroup}`
          : `--color${colorGroup}-${colorKey}`;

      const newVars =
        typeof value === "string"
          ? { [cssVariable]: value }
          : extractColorVars(value, `${colorGroup}-${colorKey}`);

      return { ...vars, ...newVars };
    },
    {}
  );
}

/**
 * @example
 * getClickablePallete('hsla(0, 0%, 98%, 1)');
 * {
 *  DEFAULT: 'hsla(0, 0%, 98%, 1)',
 *  hover: 'hsla(0, 0%, 103%, 1)',
 *  press: 'hsla(0, 0%, 93%, 1)'
 * }
 */
function getActiveColorPallete(hslaColor: Hsla) {
  return {
    DEFAULT: hslaColor,
    hover: calcHsla(hslaColor, { light: (p) => p + 5 }),
    press: calcHsla(hslaColor, { light: (p) => p - 5 }),
  };
}

/**
 * @example
 * getFontSize('3.50rem', '4.50rem', '-0.3px', '700');
 * ['3.50rem', { lineHeight: '4.50rem', letterSpacing: '-0.3px', fontWeight: '700' }]
 */
function getFontSize(
  fontSize: string,
  lineHeight: string,
  letterSpacing: string,
  fontWeight: string | number
): [
  fontSize: string,
  configuration: Partial<{
    lineHeight: string;
    letterSpacing: string;
    fontWeight: string | number;
  }>
] {
  return [fontSize, { lineHeight, letterSpacing, fontWeight }];
}

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Pretendard", ...fontFamily.sans],
    },
    fontSize: {
      "display-L": getFontSize("3.50rem", "4.50rem", "-0.3px", "700"),
      "display-M": getFontSize("2.50rem", "3.25rem", "-0.3px", "700"),
      "display-S": getFontSize("2.25rem", "2.88rem", "-0.3px", "700"),
      "headline-L": getFontSize("2.00rem", "2.63rem", "-0.3px", "600"),
      "headline-M": getFontSize("1.75rem", "2.38rem", "-0.3px", "600"),
      "headline-S": getFontSize("1.50rem", "2.13rem", "-0.3px", "600"),
      "title-L": getFontSize("1.25rem", "1.75rem", "-0.3px", "500"),
      "title-M": getFontSize("1.13rem", "1.63rem", "-0.3px", "500"),
      "title-S": getFontSize("1.00rem", "1.38rem", "-0.3px", "500"),
      "body-L": getFontSize("1.00rem", "1.50rem", "-0.3px", "400"),
      "body-L-long": getFontSize("1.00rem", "1.75rem", "-0.3px", "400"),
      "body-M": getFontSize("0.88rem", "1.25rem", "0px", "400"),
      "body-M-long": getFontSize("0.88rem", "1.50rem", "0px", "400"),
      "body-S": getFontSize("0.75rem", "1.13rem", "0px", "400"),
      "label-L": getFontSize("0.88rem", "1.25rem", "0.1px", "500"),
      "label-M": getFontSize("0.75rem", "1.13rem", "0.25px", "500"),
      "label-S": getFontSize("0.69rem", "1.00rem", "0.25px", "500"),
    },
    colors: {
      black: "hsla(0, 0%, 0%, 1)",
      white: "hsla(0, 0%, 100%, 1)",
      gray: {
        50: "hsla(0, 0%, 98%, 1)",
        100: "hsla(0, 0%, 96%, 1)",
        200: "hsla(0, 0%, 93%, 1)",
        300: "hsla(0, 0%, 88%, 1)",
        400: "hsla(0, 0%, 74%, 1)",
        500: "hsla(0, 0%, 62%, 1)",
        600: "hsla(0, 0%, 46%, 1)",
        700: "hsla(0, 0%, 38%, 1)",
        800: "hsla(0, 0%, 26%, 1)",
        900: "hsla(0, 0%, 13%, 1)",
      },
      yellow: {
        50: "hsla(53, 100%, 95%, 1)",
        100: "hsla(54, 93%, 89%, 1)",
        200: "hsla(54, 100%, 82%, 1)",
        300: "hsla(51, 100%, 68%, 1)",
        400: "hsla(46, 100%, 56%, 1)",
        500: "hsla(44, 95%, 47%, 1)",
        600: "hsla(40, 100%, 41%, 1)",
        700: "hsla(36, 100%, 34%, 1)",
        800: "hsla(30, 100%, 26%, 1)",
        900: "hsla(25, 100%, 17%, 1)",
      },
      red: {
        50: "hsla(0, 100%, 98%, 1)",
        100: "hsla(358, 100%, 93%, 1)",
        200: "hsla(0, 100%, 87%, 1)",
        300: "hsla(0, 100%, 76%, 1)",
        400: "hsla(0, 100%, 66%, 1)",
        500: "hsla(0, 86%, 55%, 1)",
        600: "hsla(1, 89%, 45%, 1)",
        700: "hsla(2, 97%, 38%, 1)",
        800: "hsla(3, 99%, 31%, 1)",
        900: "hsla(4, 100%, 25%, 1)",
      },
      blue: {
        "01": "hsla(207, 73%, 90%, 1)",
        "02": "hsla(207, 74%, 83%, 1)",
        "03": "hsla(206, 73%, 77%, 1)",
        "04": "hsla(206, 77%, 72%, 1)",
        "05": "hsla(206, 82%, 68%, 1)",
        "06": "hsla(206, 74%, 58%, 1)",
        "07": "hsla(206, 74%, 48%, 1)",
        "08": "hsla(206, 100%, 40%, 1)",
        "09": "hsla(206, 99%, 35%, 1)",
        10: "hsla(206, 99%, 31%, 1)",
        11: "hsla(206, 99%, 27%, 1)",
        12: "hsla(206, 98%, 23%, 1)",
      },
      orange: "hsla(14, 87%, 56%, 1)",
      green: "hsla(144, 83%, 44%, 1)",
      primary: {
        ...getActiveColorPallete("hsla(216, 99%, 64%, 1)"),
      },
      secondary: {
        ...getActiveColorPallete("hsla(304, 100%, 63%, 1)"),
      },
      transparent: "transparent",
    },
    container: {
      padding: {
        DEFAULT: "16px",
        md: "0",
      },
      center: true,
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1200px",
    },
  },

  corePlugins: { preflight: false },
  plugins: [
    plugin(({ addBase, theme }) => {
      addBase({
        ":root": extractColorVars(theme("colors")),
      });
    }),
  ],
} satisfies Config;
