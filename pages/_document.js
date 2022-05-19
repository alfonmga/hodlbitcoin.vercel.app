import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <script
          async
          type="module"
          strategy="beforeInteractive"
          src="/sql-loader.js"
        />
        <NextScript />
      </body>
    </Html>
  );
}
