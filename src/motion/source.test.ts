import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createMotionSource } from "./source";

class OrientationEvent extends Event {
  constructor(
    readonly beta: number | null,
    readonly gamma: number | null,
  ) {
    super("deviceorientation");
  }
}

function createFixture(permission?: "granted" | "denied") {
  const windowEvents = new EventTarget();
  const documentEvents = Object.assign(new EventTarget(), { hidden: false });
  const orientation = Object.assign(new EventTarget(), { angle: 0 });
  const requestPermission = vi.fn(async () => permission);
  class PermissionOrientationEvent extends OrientationEvent {
    static requestPermission = requestPermission;
  }
  vi.stubGlobal("window", windowEvents);
  vi.stubGlobal("document", documentEvents);
  vi.stubGlobal("screen", { orientation });
  vi.stubGlobal("navigator", { maxTouchPoints: 1 });
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal(
    "DeviceOrientationEvent",
    permission ? PermissionOrientationEvent : OrientationEvent,
  );
  const onTilt = vi.fn();
  const onAvailable = vi.fn();
  const onEnabled = vi.fn();
  const source = createMotionSource(onTilt, onAvailable, onEnabled);
  if (!source) throw new Error("テスト用センサーを初期化できませんでした。");
  return {
    source,
    windowEvents,
    documentEvents,
    orientation,
    requestPermission,
    onTilt,
    onAvailable,
    onEnabled,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("モーション操作の許可とセンサー接続", () => {
  it("初期状態では権限を求めず、オンにするときにだけ求める", async () => {
    const fixture = createFixture("granted");
    expect(fixture.requestPermission).not.toHaveBeenCalled();
    expect(fixture.onEnabled).not.toHaveBeenCalledWith(true);
    expect(await fixture.source.enable()).toBe(true);
    expect(fixture.requestPermission).toHaveBeenCalledOnce();
    expect(fixture.onEnabled).toHaveBeenLastCalledWith(true);
  });

  it("権限を拒否したら視点を動かさない", async () => {
    const fixture = createFixture("denied");
    expect(await fixture.source.enable()).toBe(false);
    fixture.windowEvents.dispatchEvent(new OrientationEvent(60, 0));
    fixture.windowEvents.dispatchEvent(new OrientationEvent(90, 30));
    expect(fixture.onTilt).not.toHaveBeenCalled();
    expect(fixture.onEnabled).not.toHaveBeenCalledWith(true);
  });

  it("権限APIがない端末では有効なセンサー値を確認するまで対応扱いにしない", () => {
    const fixture = createFixture();
    fixture.windowEvents.dispatchEvent(new OrientationEvent(null, null));
    fixture.windowEvents.dispatchEvent(new OrientationEvent(Infinity, 0));
    expect(fixture.onAvailable).not.toHaveBeenCalled();
    fixture.windowEvents.dispatchEvent(new OrientationEvent(60, 0));
    expect(fixture.onAvailable).toHaveBeenCalledWith(true);
    expect(fixture.onTilt).not.toHaveBeenCalled();
  });

  it("オンにした後の姿勢を基準にし、オフにするとセンサーを切り離す", async () => {
    const fixture = createFixture("granted");
    await fixture.source.enable();
    fixture.windowEvents.dispatchEvent(new OrientationEvent(60, 0));
    fixture.windowEvents.dispatchEvent(new OrientationEvent(75, 15));
    expect(fixture.onTilt).toHaveBeenLastCalledWith(0.5, 0.5);
    fixture.source.disable();
    fixture.onTilt.mockClear();
    fixture.windowEvents.dispatchEvent(new OrientationEvent(90, 30));
    expect(fixture.onTilt).not.toHaveBeenCalled();
    expect(fixture.onEnabled).toHaveBeenLastCalledWith(false);
  });

  it("画面を回転した後は再び基準を取り、視点を急に動かさない", async () => {
    const fixture = createFixture("granted");
    await fixture.source.enable();
    fixture.windowEvents.dispatchEvent(new OrientationEvent(60, 0));
    fixture.orientation.angle = 90;
    fixture.orientation.dispatchEvent(new Event("change"));
    fixture.windowEvents.dispatchEvent(new OrientationEvent(90, 30));
    expect(fixture.onTilt).toHaveBeenLastCalledWith(0, 0);
  });
});
