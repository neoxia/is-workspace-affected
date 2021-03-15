"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = __importDefault(require("@actions/core"));
var fslib_1 = require("@yarnpkg/fslib");
var simple_git_1 = __importDefault(require("simple-git"));
var yarn_1 = __importDefault(require("./yarn"));
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var inputs_1, git_1, project, workspace_1, tags, isTag, baseRef_1, diff, affected, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                inputs_1 = {
                    projectRoot: core_1.default.getInput('project-root') || '.',
                    workspace: core_1.default.getInput('workspace', { required: true }),
                    base: core_1.default.getInput('base', { required: true }),
                };
                git_1 = simple_git_1.default({ baseDir: inputs_1.projectRoot });
                return [4 /*yield*/, yarn_1.default.getProject(inputs_1.projectRoot)];
            case 1:
                project = _a.sent();
                workspace_1 = project.workspaces.find(function (wks) { var _a; return ((_a = wks.manifest.name) === null || _a === void 0 ? void 0 : _a.name) === inputs_1.workspace; });
                if (!workspace_1) {
                    return [2 /*return*/, core_1.default.setFailed("Workspace " + inputs_1.workspace + " not found.")];
                }
                return [4 /*yield*/, core_1.default.group('git fetch --tags', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, git_1.fetch(['--tags'])];
                                case 1:
                                    result = _a.sent();
                                    core_1.default.info(result.raw);
                                    return [4 /*yield*/, git_1.tags()];
                                case 2: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            case 2:
                tags = _a.sent();
                // Fetch base
                return [4 /*yield*/, core_1.default.group("git fetch origin " + inputs_1.base, function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, git_1.fetch('origin', inputs_1.base, ['--progress', '--depth=1'])];
                                case 1:
                                    result = _a.sent();
                                    core_1.default.info(result.raw);
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 3:
                // Fetch base
                _a.sent();
                isTag = tags.all.some(function (tag) { return tag === inputs_1.base; });
                baseRef_1 = inputs_1.base;
                if (!isTag) {
                    baseRef_1 = "origin/" + baseRef_1;
                }
                return [4 /*yield*/, core_1.default.group('git diff', function () { return __awaiter(void 0, void 0, void 0, function () {
                        var res;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, git_1.diff(['--name-only', baseRef_1, '--', fslib_1.npath.fromPortablePath(workspace_1.cwd)])];
                                case 1:
                                    res = _a.sent();
                                    core_1.default.info(res);
                                    return [2 /*return*/, res];
                            }
                        });
                    }); })];
            case 4:
                diff = _a.sent();
                affected = diff.split('\n').some(function (l) { return l !== ''; });
                if (affected) {
                    core_1.default.setOutput('affected', true);
                    core_1.default.info("Workspace " + inputs_1.workspace + " affected");
                }
                else {
                    core_1.default.info("Workspace " + inputs_1.workspace + " not affected");
                }
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                core_1.default.setFailed(error_1.message);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); })();
