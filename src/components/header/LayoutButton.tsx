import * as headerStyles from "./HeaderButton.module.css";
import * as styles from "./LayoutButton.module.css";
import { Presenter } from "../../domain/schema";
import { queries } from "../../domain/queries2";
import AppState from "../../domain/ephemeral/AppState";
import { first, useQuery2 } from "@vlcn.io/react";

type Props = {
  appState: AppState;
};

export default function LayoutButton({ appState }: Props) {
  const presenter = first(
    useQuery2(appState.ctx, queries.chosenPresenter, [appState.current_deck_id])
      .data
  );
  return <LayoutButtonImpl presenter={presenter} appState={appState} />;
}

function LayoutButtonImpl({
  presenter,
  appState,
}: {
  presenter?: Presenter;
  appState: AppState;
}) {
  const switchToLayoutEditor = () => {
    appState.setEditorMode("layout");
  };
  return (
    <div
      className={
        styles.root +
        " " +
        headerStyles.root +
        " right-pad" +
        (presenter?.picked_transition !== "Custom"
          ? " disp-none"
          : " inline-block")
      }
    >
      <button
        className={"btn btn-outline-warning"}
        type="button"
        aria-expanded="false"
        title="Only enabled when using a custom layout (see dropdown to the right)"
        onClick={switchToLayoutEditor}
      >
        <i className={"bi bi-layout-wtf " + headerStyles.icon}></i>
        Layout
      </button>
    </div>
  );
}
