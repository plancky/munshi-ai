type AudioFileState = {
    file: File;
    metadata: any;
};

export enum AudioSelectMethod {
    UPLOAD = "upload",
    DOWNLOAD = "download",
}

export type FormState = {
    audioSelectMethod: AudioSelectMethod;
    audioFile?: AudioFileState;
};

// Define Action "types" on FormState
export enum FormStateActionTypes {
    AUDIO_METHOD_MUTATION = "audio_method_mutation",
    ADD_AUDIO_FILE = "add_audio_file",
    REMOVE_AUDIO_FILE = "remove_audio_file",
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
};

export type FormActions =
    | MutateAudioSelectMethodAction
    | AddAudioAction
    | RmAudioAction;

export function audioSelectReducer(
    state: FormState,
    action: FormActions,
): FormState {
    switch (action.type) {
        case FormStateActionTypes.AUDIO_METHOD_MUTATION:
            return {
                ...state,
                audioSelectMethod: action?.payload?.value,
            };
            break;

        case FormStateActionTypes.ADD_AUDIO_FILE:
            const modedAudioFile: any = {};
            const { metadata, file } = action?.payload;
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

        case FormStateActionTypes.REMOVE_AUDIO_FILE:
            return {
                ...state,
                audioFile: undefined,
            };

        default:
            return state;
            break;
    }
}
