import { type ReactNode } from "react";
import { type ResolvedResourceItem } from "./resource";

export interface ContentTemplateTrait {
    label: string;
    value: ReactNode;
}

export interface ContentTemplateRelatedGroup {
    label: string;
    count: number;
    items: ResolvedResourceItem[];
    icon: ReactNode;
}
