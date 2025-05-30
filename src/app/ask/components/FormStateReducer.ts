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
};

// Define Action "types" on FormState
export enum FormStateActionTypes {
    AUDIO_METHOD_MUTATION = "audio_method_mutation",
    ADD_AUDIO_FILE = "add_audio_file",
    REMOVE_AUDIO_FILE = "remove_audio_file",
    UPLOADED = "uploaded",
    OVERWRITE = "overwrite",
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

export type FormStateReducerActions =
    | MutateAudioSelectMethodAction
    | AddAudioAction
    | RmAudioAction
    | UploadedAudioAction
    | OverWriteState;

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
    const obj: StoredStateObj = { ...state };
    if (state?.audioFile?.file) {
        obj.audioFileStored = {
            //file: URL.createObjectURL(state.audioFile.file),
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
