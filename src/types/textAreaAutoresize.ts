export type Props = {
    value: string,
    changeEvent: (value: string) => void,
    disabled: boolean,
    invalidText: boolean,
    editedBy: string | null,
    lockFirstTwoLines?: boolean
}
