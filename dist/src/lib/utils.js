"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrigin = void 0;
const getOrigin = () => {
    if (typeof location !== "undefined") {
        return location.origin;
    }
    return process.env.NEXTAUTH_URL || "";
};
exports.getOrigin = getOrigin;
