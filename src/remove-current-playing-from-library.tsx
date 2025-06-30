import { closeMainWindow, showToast, Toast } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as music from "./util/scripts";

export default async () => {
  closeMainWindow();

  await pipe(
  // Get current track metadata
  music.currentTrack.getCurrentTrackInfo(),

  // Reveal the current track in Music
  TE.chainFirst(() => pipe(
    music.currentTrack.reveal,
    TE.apFirst(music.general.activate),
  )),

  // Remove from Library
  TE.chainW((track) =>
    pipe(
      music.currentTrack.removeFromLibrary,
      TE.map(() => track), // preserve original metadata
    )
  ),

  // Show success toast
  TE.map((track) =>
    showToast({
      style: Toast.Style.Success,
      title: `Removed ${track.artist} - ${track.name} from Library.`,
    })
  ),

  // Show failure toast
  TE.mapLeft(() =>
    showToast({
      style: Toast.Style.Failure,
      title: "Error while removing track from Library.",
    })
  ),

  // Continue playing the playlist
  TE.chainW(() => music.player.play)
)();
};
