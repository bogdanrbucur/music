import { closeMainWindow, showToast, Toast } from "@raycast/api";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as music from "./util/scripts";

const showAnimatedToast = async (track: any) => {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: `Removed track ${track.artist} - ${track.name} from Library and Downloads.`,
    message: "This action cannot be undone. Re-add the track to your Library if you want to keep it.",
  });
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await toast.hide();
};

export default async () => {
  closeMainWindow();

  await pipe(
    // Get current track metadata
    music.currentTrack.getCurrentTrackInfo(),
    // Reveal the current track in Music
    TE.chainFirst(() => pipe(music.currentTrack.reveal, TE.apFirst(music.general.activate))),

    // Next track
    TE.chainFirst(() => pipe(music.player.next)),

    // Remove from Library
    TE.chainW((track) =>
      pipe(
        music.currentTrack.removeFromLibrary,
        TE.map(() => track), // preserve original metadata
      ),
    ),
    // Show animated toast for 5 seconds (side effect, keep original value)
    TE.chainFirstTaskK((track) => () => showAnimatedToast(track)),

    // Show failure toast
    TE.mapLeft(() =>
      showToast({
        style: Toast.Style.Failure,
        title: "Error while removing track from Library.",
      }),
    ),
  )();
};
