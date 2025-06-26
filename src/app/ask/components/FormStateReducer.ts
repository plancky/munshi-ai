type AudioFileState = {
    file?: File;
    metadata: any;
};

export enum AudioSelectMethod {
    UPLOAD = "upload",
    DOWNLOAD = "download",
}

export type FormState = {
    audioSelectMethod: AudioSelectMethod;
    audioFile?: AudioFileState;
    isUploaded: boolean;
    id?: string;
    enableSpeakers: boolean;
    numSpeakers: number;
};

// Define Action "types" on FormState
export enum FormStateActionTypes {
    AUDIO_METHOD_MUTATION = "audio_method_mutation",
    ADD_AUDIO_FILE = "add_audio_file",
    REMOVE_AUDIO_FILE = "remove_audio_file",
    UPLOADED = "uploaded",
    OVERWRITE = "overwrite",
    SET_SPEAKER_SETTINGS = "set_speaker_settings",
}

type MutateAudioSelectMethodAction = {
    type: FormStateActionTypes.AUDIO_METHOD_MUTATION;
    payload: {
        value: AudioSelectMethod;
    };
};

type AddAudioAction = {
    type: FormStateActionTypes.ADD_AUDIO_FILE;
    payload: {
        file: File;
        metadata?: any;
    };
};

type RmAudioAction = {
    type: FormStateActionTypes.REMOVE_AUDIO_FILE;
    payload: {};
};

type UploadedAudioAction = {
    type: FormStateActionTypes.UPLOADED;
    payload: {
        id: string;
    };
};

type OverWriteState = {
    type: FormStateActionTypes.OVERWRITE;
    payload: FormState;
};

type SetSpeakerSettingsAction = {
    type: FormStateActionTypes.SET_SPEAKER_SETTINGS;
    payload: {
        enableSpeakers: boolean;
        numSpeakers: number;
    };
};

export type FormStateReducerActions =
    | MutateAudioSelectMethodAction
    | AddAudioAction
    | RmAudioAction
    | UploadedAudioAction
    | OverWriteState
    | SetSpeakerSettingsAction;

// Reducer
export function audioSelectReducer(
    state: FormState,
    action: FormStateReducerActions,
): FormState {
    const { type, payload } = action;
    switch (type) {
        case FormStateActionTypes.AUDIO_METHOD_MUTATION:
            return {
                ...state,
                audioSelectMethod: payload?.value,
            };
            break;

        case FormStateActionTypes.ADD_AUDIO_FILE:
            const modedAudioFile: any = {};
            const { metadata, file } = payload;
            if (metadata) modedAudioFile.metadata = metadata;
            if (file) modedAudioFile.file = file;
            return {
                ...state,
                audioFile: {
                    ...state.audioFile,
                    ...modedAudioFile,
                },
            };
            break;

        case FormStateActionTypes.REMOVE_AUDIO_FILE: {
            const new_state = {
                ...state,
                audioFile: undefined,
                isUploaded: false,
                id: undefined,
            };
            saveState(new_state);
            return new_state;
        }
        case FormStateActionTypes.UPLOADED:
            const { id } = payload;
            const new_state = {
                ...state,
                isUploaded: true,
                id,
            };
            saveState(new_state);
            return new_state;

        case FormStateActionTypes.SET_SPEAKER_SETTINGS:
            const { enableSpeakers, numSpeakers } = payload;
            const updated_state = {
                ...state,
                enableSpeakers,
                numSpeakers,
            };
            saveState(updated_state);
            return updated_state;

        default:
            return { ...state, ...payload };
            break;
    }
}

// Save formState to browser's localStorage
interface StoredStateObj extends FormState {
    audioFileStored?: {
        metadata: AudioFileState["metadata"];
        // file?: string;
    };
}

export function saveState(state: FormState) {
    if (!localStorage) return;
    
    // Don't save state if there's no actual file object
    // This prevents stale metadata-only states
    if (!state?.audioFile?.file) {
        localStorage.removeItem("formState");
        return;
    }
    
    const obj: StoredStateObj = { ...state };
    if (state?.audioFile?.file) {
        obj.audioFileStored = {
            metadata: state.audioFile?.metadata,
        };
        delete obj.audioFile;
    }
    localStorage?.setItem("formState", JSON.stringify(obj));
}

export function retrieveState<T>() {
    if (!localStorage) return;
    const itemString = localStorage?.getItem("formState");
    if (!itemString) return null;

    const storedState: StoredStateObj = JSON.parse(itemString);
    
    // Since File objects can't be persisted, and we only show metadata without files,
    // it's better to start fresh to avoid confusing UX
    if (storedState?.audioFileStored && !storedState?.audioFile?.file) {
        localStorage.removeItem("formState");
        return null;
    }

    const state = { ...storedState };

    if (storedState?.audioFileStored) {
        state.audioFile = {
            metadata: storedState.audioFileStored.metadata,
            // file: new File([blob], storedState.audioFileStored.metadata?.name),
        };
    }
    delete state.audioFileStored;
    return state as FormState;
}
