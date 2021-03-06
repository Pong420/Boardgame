import React from 'react';
import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript
} from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return initialProps;
  }

  render() {
    return (
      <Html>
        <Head>
          <link rel="preload" href="/preload.js" as="script" />
          <link rel="preload" href="/font/font.css" as="style" />
          <link rel="stylesheet" href="/font/font.css" as="style" />
        </Head>
        <body>
          <script src="/preload.js" />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
