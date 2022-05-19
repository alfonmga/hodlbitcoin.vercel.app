import "../styles/globals.css";
import type { AppProps } from "next/app";

function HoldBitcoinApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default HoldBitcoinApp;
