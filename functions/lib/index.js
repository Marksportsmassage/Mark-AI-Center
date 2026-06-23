"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineWebhook = void 0;
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)({
    projectId: "mark-ai-center"
});
var lineWebhook_1 = require("./lineWebhook");
Object.defineProperty(exports, "lineWebhook", { enumerable: true, get: function () { return lineWebhook_1.lineWebhook; } });
//# sourceMappingURL=index.js.map