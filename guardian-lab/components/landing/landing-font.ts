import { Plus_Jakarta_Sans } from "next/font/google";
import styles from "./landing.module.css";

const landingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-landing-sans",
  display: "swap",
});

export const landingTypography = `${landingFont.variable} ${landingFont.className} ${styles.typeface}`;
