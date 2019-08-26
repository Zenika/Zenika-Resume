import {Config} from '../config';
import uuid from 'uuid';

export type Document = {
    uuid: string;
    path: string;
    content: any;
    metadata: Metadata;
    last_modified: number;
    last_modified_locally: number;
}

export type Metadata = {
        name: string,
        firstname: string,
        email: string,
        agency: string,
        lang: string,
        experience: string,
        description: string,
        column1: string,
        column2: string,
        column3:string,
        theme: string
}

export const initDocument = (): Document => ({
    uuid: uuid.v4(),
    path: "",
    content: Config.DEFAULT_CONTENT,
    metadata: Config.DEFAULT_METADATA,
    last_modified: 0, // defined by the server
    last_modified_locally: 0
})


  export const hasDefaultContent = (document: Document) => {
    return Config.DEFAULT_CONTENT === document.content;
  }

  export const hasDefaultMetadata = (document: Document) => {
    return Config.DEFAULT_METADATA === document.metadata;
  }

  export const hasNeverBeenSync = (document: Document) => {
    return null === document.last_modified;
  }

  export const hasNoLocalChanges = (document: Document) => {
    return null === document.last_modified_locally;
  }

  export const isNew = (document: Document) => {
    return hasDefaultContent(document) && hasDefaultMetadata(document) && hasNeverBeenSync(document) && hasNoLocalChanges(document);
  }
