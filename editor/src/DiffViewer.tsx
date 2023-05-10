import { MapController } from "./utils/MapController";
import { useEffect, useState } from "react";
import { createMapFromZip } from "./Import";
import TimeMachineApi, { SnapshotInfo } from "./utils/TimeMachineApi";
import MainMenu from "./MainMenu";

type Props = {
  mapController: MapController;
  initialLeftSnapshotId: number;
  initialRightSnapshotId: number;
  setLoaded(isLoaded: boolean): void;
  msgboxShow(title: string, msg: string): void;
};

const gloablSnapshotCache: { [key: number]: ArrayBuffer } = {};

function DiffViewer(props: Props): JSX.Element {
  const mapController = props.mapController;
  const [snapshotInfo, setSnapshotInfo] = useState<SnapshotInfo | null>(null);

  const loadSnapshot = async () => {
    console.log("loading left snapshot", props.initialLeftSnapshotId);
    console.log("loading right snapshot", props.initialRightSnapshotId);
    props.setLoaded(false);
    const leftSnapshotInfoRes = await TimeMachineApi.getSnapshotInfo(props.initialLeftSnapshotId);
    if (!leftSnapshotInfoRes.ok) {
      console.log(leftSnapshotInfoRes);
      props.msgboxShow("error", "error-failed-to-load-snapshot");
      return;
    }
    const snapshotInfo = leftSnapshotInfoRes.ok;

    let snapshot;
    if (gloablSnapshotCache[snapshotInfo.id]) {
      snapshot = gloablSnapshotCache[snapshotInfo.id];
    } else {
      const snapshotRes = await TimeMachineApi.downloadSnapshot(
        snapshotInfo.downloadToken
      );
      if (!snapshotRes.ok) {
        console.log(leftSnapshotInfoRes);
        props.msgboxShow("error", "error-failed-to-load-snapshot");
        return;
      }
      snapshot = snapshotRes.ok;
      gloablSnapshotCache[snapshotInfo.id] = snapshot;
    }
    const map = await createMapFromZip(snapshot);
    mapController.replaceFogMap(map);
    setSnapshotInfo(snapshotInfo);
    props.setLoaded(true);
  };

  useEffect(() => {
    loadSnapshot();
  }, [props.initialRightSnapshotId,props.initialLeftSnapshotId]);

  if (!snapshotInfo) {
    return <></>;
  } else {
    return (
      <>
        <MainMenu
          mapController={mapController}
          msgboxShow={props.msgboxShow}
          mode="viewer"
        />
      </>
    );
  }
}

export default DiffViewer;
