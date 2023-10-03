import { vi, describe, test, expect, beforeEach, SpyInstance } from 'vitest';
import * as helper from '../../lib/helper';
import {
  CLI_UPDATE_CHECK_INTERVAL,
  notifyNeedUpdateCLI,
} from '../../lib/notify-update';

const localVersion = 'v0.0.1';
const publishedVersion = 'v0.0.2';

const configGetMock = vi.fn();

vi.mock('configstore', () => ({
  default: function () {
    return {
      set: () => void 0,
      get: configGetMock.mockReturnValue(0),
    };
  },
}));

describe('CLIのアップデート通知のテスト', () => {
  let consoleLogMock: SpyInstance;
  let getCurrentCliVersionMock: SpyInstance;
  let getPublishedCliVersionMock: SpyInstance;

  beforeEach(() => {
    consoleLogMock = vi.spyOn(console, 'log').mockReturnValue(undefined);
    getCurrentCliVersionMock = vi
      .spyOn(helper, 'getCurrentCliVersion')
      .mockReturnValue(localVersion);
    getPublishedCliVersionMock = vi
      .spyOn(helper, 'getPublishedCliVersion')
      .mockResolvedValue(publishedVersion);
  });

  test('公開されているバージョンがローカルと違う場合はアラートを表示する', async () => {
    await notifyNeedUpdateCLI();

    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining('新しいバージョンがリリースされています')
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining(localVersion)
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining(publishedVersion)
    );
  });

  test('ローカルと公開されているバージョンが同じ場合はアラートを表示しない', async () => {
    getCurrentCliVersionMock.mockReturnValueOnce('v0.0.0');
    getPublishedCliVersionMock.mockResolvedValueOnce('v0.0.0');

    await notifyNeedUpdateCLI();

    expect(consoleLogMock).not.toBeCalled();
  });

  test('一度アラート表示したら一定時間経過しないと再度表示されない', async () => {
    await notifyNeedUpdateCLI();
    expect(consoleLogMock).toBeCalled();

    // 現在時刻を設定
    configGetMock.mockReturnValueOnce(Date.now());
    await notifyNeedUpdateCLI();
    expect(consoleLogMock).toBeCalledTimes(1);

    // 一定時間経過後の値を設定
    configGetMock.mockReturnValueOnce(
      Date.now() - CLI_UPDATE_CHECK_INTERVAL - 1
    );
    await notifyNeedUpdateCLI();
    expect(consoleLogMock).toBeCalledTimes(2);
  });
});
