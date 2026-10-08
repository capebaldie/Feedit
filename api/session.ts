// Lets the client decide between the login screen and the feed without
// proxying any Reddit data.
import { json, verifySession } from "./_helpers";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  const authenticated = await verifySession(request);
  return json({ authenticated }, authenticated ? 200 : 401);
}
