import React, { useEffect } from "react";
import { createContext, useReducer } from "react";
import {
    FormStateReducerActions,
    AudioSelectMethod,
    FormState,
    saveState,
    retrieveState,
    FormStateActionTypes,
} from "./FormStateReducer";

import { audioSelectReducer } from "./FormStateReducer";

type FormStateContext = {
    formState: FormState;
    dispatch?: React.Dispatch<FormStateReducerActions>;
};

const InitialFormState: FormState = {
    audioSelectMethod: AudioSelectMethod.UPLOAD,
    isUploaded: false,
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
        const stored_state = retrieveState();
        if (stored_state) {
            dispatch!({
                type: FormStateActionTypes.OVERWRITE,
                payload: stored_state,
            });
        }
    }, []);

    return (
        <FormStateContext.Provider value={{ formState: state, dispatch }}>
            {children}
        </FormStateContext.Provider>
    );
}
