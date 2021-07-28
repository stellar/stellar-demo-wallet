import { Heading1, Layout, Eyebrow } from "@stellar/design-system";

export const NotFound = () => (
  <Layout.Inset>
    <div className="NotFoundPage">
      <Eyebrow>Error 404</Eyebrow>
      <Heading1>Sorry, that page couldn’t be found.</Heading1>
      <p>Have you tried turning it off and on again?</p>
    </div>
  </Layout.Inset>
);
