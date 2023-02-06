export const getOrigin = () => {
  if (typeof location !== "undefined") {
    return location.origin;
  }
  return process.env.NEXTAUTH_URL || "";
};
