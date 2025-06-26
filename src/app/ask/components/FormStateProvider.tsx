import React, { useEffect } from "react";
import { createContext, useReducer } from "react";
import {
    FormStateReducerActions,
    AudioSelectMethod,
    FormState,
} from "./FormStateReducer";

import { audioSelectReducer } from "./FormStateReducer";

type FormStateContext = {
    formState: FormState;
    dispatch?: React.Dispatch<FormStateReducerActions>;
};

const InitialFormState: FormState = {
    audioSelectMethod: AudioSelectMethod.UPLOAD,
    isUploaded: false,
    enableSpeakers: true,  // Default to enabling speaker diarization
    numSpeakers: 2,        // Default to 2 speakers
};

export const FormStateContext = createContext<FormStateContext>({
    formState: InitialFormState,
    dispatch: undefined,
});

export function useFormState() {
    return React.useContext(FormStateContext);
}

export function FormStateContextProvider({ children }) {
    const [state, dispatch] = useReducer(audioSelectReducer, InitialFormState);

    useEffect(() => {
        // Always start fresh on the ask page to avoid stale state
        // File objects can't be persisted anyway, so this provides the clearest UX
        if (localStorage) {
            localStorage.removeItem('formState');
        }

        // Cleanup function: clear form state when leaving the ask page
        return () => {
            if (localStorage) {
                localStorage.removeItem('formState');
            }
        };
    }, []);

    return (
        <FormStateContext.Provider value={{ formState: state, dispatch }}>
            {children}
        </FormStateContext.Provider>
    );
}
