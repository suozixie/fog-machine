import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  Container,
  Content,
  Divider,
  IconButton,
  Panel,
  SelectPicker,
  Button,
  Modal,
  Uploader,
  Form,
} from "rsuite";
import ConversionIcon from "@rsuite/icons/Conversion";
import PlusIcon from "@rsuite/icons/Plus";
import emptyIcon from "./empty.png";
import mapIcon from "./map.svg";
import TimeMachineHome from "../time-machine/Home";

import "./Home.css";
import { FC, useEffect, useState } from "react";
import Api, { Snapshot } from "../time-machine/Api";
import moment from "moment";

let initingLoginStatus = false;
function Contrast() {
  const [loginStatus, setLoginStatus] = useState<
    "loggedIn" | "unLoggedIn" | "openLogin"
  >("unLoggedIn");
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [snapshotOptions, setSnapshotOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [leftSnapshotId, setLeftSnapshotId] = useState<number | null>(null);
  const [rightSnapshotId, setRightSnapshotd] = useState<number | null>(null);
  const [snapshotList, setSnapshotList] = useState<Snapshot[]>([]);
  const currentPage = 1;

  const [isLoading, setIsLoading] = useState(true);

  const [uploadDialogState, setUploadDialogState] = useState<
    "opened" | "closed"
  >("closed");

  useEffect(() => {
    const initLoginStatus = async () => {
      const userInfo = await Api.getUserInfo();
      if (userInfo) {
        setLoginStatus("loggedIn");
      } else {
        setLoginStatus("unLoggedIn");
      }
    };
    if (loginStatus != "loggedIn" && loginStatus != "openLogin") {
      if (!initingLoginStatus) {
        initingLoginStatus = true;
        setLoginStatus("unLoggedIn");
        initLoginStatus().finally(() => {
          initingLoginStatus = false;
        });
      }
    }
  }, [loginStatus]);

  const FileBox: FC<{
    snapshotId: number | null;
    setSnapshotId: (snapshotId: number | null) => void;
  }> = ({ snapshotId, setSnapshotId }) => {
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

    useEffect(() => {
      if (snapshotId) {
        const cur = snapshotList.find(
          (snap: Snapshot) => snap.id === snapshotId
        );
        if (cur !== undefined) setSnapshot(cur);
      }
    }, [snapshotId]);

    return (
      <Panel shaded bordered bodyFill>
        <div className="file-box">
          <div className="file-box-content">
            {snapshot !== null ? (
              <>
                <img
                  src={mapIcon}
                  alt="map_icon"
                  className="file-box-content__map"
                />
                <div className="file-box-content-name">
                  <span>SnapShot</span>
                  <span>
                    ({moment(snapshot.timestamp).format("YYYY-MM-DD")}))
                  </span>
                </div>
              </>
            ) : (
              <>
                <img src={emptyIcon} alt="empty_icon" />
                <span>{t("contrast-no-more-snapshots")}</span>
              </>
            )}
          </div>
          <Divider />
          <div className="file-box-buttons">
            <IconButton
              icon={<PlusIcon />}
              onClick={() => {
                setUploadDialogState("opened");
              }}
            >
              {t("contrast-local-select")}
            </IconButton>
            <span>Or</span>
            {loginStatus == "loggedIn" ? (
              <SelectPicker
                data={snapshotOptions}
                value={snapshotId}
                onChange={(value) => setSnapshotId(value)}
                style={{ width: 224 }}
                loading={isLoading}
              />
            ) : (
              <Button
                onClick={() => {
                  setLoginStatus("openLogin");
                }}
              >
                {t("contrast-login")}
              </Button>
            )}
          </div>
        </div>
      </Panel>
    );
  };

  const contrast = () => {
    console.log(leftSnapshotId, rightSnapshotId);
    window.location.href = `http://127.0.0.1:3001/?contrast-snapshot=${leftSnapshotId},${rightSnapshotId}`;
  };
  const RenderContent = () => (
    <div className="contrast">
      <div className="contrast-content">
        <FileBox
          snapshotId={leftSnapshotId}
          setSnapshotId={setLeftSnapshotId}
        />
        <div className="contrast__icon">
          <ConversionIcon />
        </div>
        <FileBox
          snapshotId={rightSnapshotId}
          setSnapshotId={setRightSnapshotd}
        />
      </div>
      {leftSnapshotId && rightSnapshotId ? (
        <div className="contrast-buttons">
          <Button appearance="primary" block onClick={() => contrast()}>
            Contrast
          </Button>
        </div>
      ) : null}
      <Modal
        open={uploadDialogState != "closed"}
        onClose={() => {
          setUploadDialogState("closed");
        }}
        backdrop={"static"}
      >
        <Modal.Header>
          <Modal.Title>{t("data-upload-title")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Uploader
              action="//jsonplaceholder.typicode.com/posts/"
              disableMultipart={true}
              multiple={false}
              disabled={uploadDialogState == "closed"}
              accept=".zip"
              draggable
            >
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span>
                  {t("data-upload-prompt")}
                  <br />
                  {t("contrast-local-note")}
                </span>
              </div>
            </Uploader>

            <Modal.Footer style={{ marginTop: "16px" }}>
              <Form.Group>
                <Button type="submit" appearance="primary">
                  {t("data-form-submit")}
                </Button>
              </Form.Group>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const result = await Api.listSnapshots(currentPage, 100);
      if (result.ok) {
        const { snapshots = [] } = result.ok;

        if (snapshots.length) {
          const nextSnapshotOptions = snapshots.map(
            ({ timestamp, id, sourceKind, note }: Snapshot) => {
              const renderTime: string = moment(timestamp).format("YYYY-MM-DD");
              const renderResource: string =
                sourceKind == "Sync"
                  ? t("snapshot-list-source-sync")
                  : note
                  ? note
                  : t("snapshot-list-source-upload");
              return {
                label: `${renderTime} (${renderResource})`,
                value: id,
              };
            }
          );

          setSnapshotList(snapshots);
          setSnapshotOptions(nextSnapshotOptions);
        }
      } else {
        console.log(result);
      }
      setIsLoading(false);
    };
    loadData();
  }, [currentPage, t]);

  return (
    <div>
      <Container>
        <Content>
          <div className="time-machine-body">
            <Breadcrumb
              style={{ marginTop: "5vh", marginBottom: "0", fontSize: "19px" }}
            >
              <Breadcrumb.Item
                onClick={() => {
                  navigate("/", { replace: false });
                }}
                href="/"
              >
                {t("home-main-title")}
              </Breadcrumb.Item>
              <Breadcrumb.Item active>
                {t("home-contrast-title")}
              </Breadcrumb.Item>
            </Breadcrumb>
            <Divider style={{ marginTop: "1vh" }} />
            {loginStatus == "openLogin" ? (
              <TimeMachineHome isOnlyUseLogin={true} />
            ) : (
              <RenderContent />
            )}
          </div>
        </Content>
      </Container>
    </div>
  );
}
export default Contrast;
