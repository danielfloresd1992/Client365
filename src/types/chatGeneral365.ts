export type T_User = {
    name: string;
    userId: string;
}


export type T_SharedAlert = {
    title?: string,
    menu?: string,
    validation?: string | null,
    localName?: string,
    image?: string
}

export type T_ReplyTo = {
    messageId?: string,
    message?: string,
    name?: string
}

export type Tmsm = {
    _id: string,
    message: string,
    submittedByUser: T_User,
    date: string,
    sharedAlert?: T_SharedAlert,
    replyTo?: T_ReplyTo
}
