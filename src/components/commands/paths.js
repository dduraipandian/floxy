import { BaseCommand } from "./base.js";

import * as constants from "../constants.js";

class SetBezierPath extends BaseCommand {
  static get capability() {
    return constants.PATH_CAPABILITIES.BEZIER;
  }
  static get group() {
    return "path";
  }
  static get order() {
    return 10;
  }
  static get icon() {
    // svg for bezier path
    return "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M 4 8 C 12 0, 16 24, 20 10' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>";
  }

  execute(flow, manager, connection) {
    connection.setPathStyle(constants.CONNECTION_PATH_TYPES.BEZIER);
    return true;
  }
}

class SetLinePath extends BaseCommand {
  static get capability() {
    return constants.PATH_CAPABILITIES.LINE;
  }
  static get group() {
    return "path";
  }
  static get order() {
    return 20;
  }
  static get icon() {
    // svg for line path
    return "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M2 12H22' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>";
  }

  execute(flow, manager, connection) {
    connection.setPathStyle(constants.CONNECTION_PATH_TYPES.LINE);
    return true;
  }
}

class SetOrthogonalPath extends BaseCommand {
  static get capability() {
    return constants.PATH_CAPABILITIES.ORTHOGONAL;
  }
  static get group() {
    return "path";
  }
  static get order() {
    return 30;
  }
  static get icon() {
    // svg for orthogonal path
    return "<svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M0 2 H10 V20 H20' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>";
  }

  execute(flow, manager, connection) {
    connection.setPathStyle(constants.CONNECTION_PATH_TYPES.ORTHOGONAL);
    return true;
  }
}

export { SetBezierPath, SetLinePath, SetOrthogonalPath };
