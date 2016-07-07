import {Record} from 'immutable';
import {Config} from './Config';
import uuid from 'uuid';

export default class Document extends Record({
  uuid: uuid.v4(),
  path: null,
  content: Config.DEFAULT_CONTENT,
  metadata: Config.DEFAULT_METADATA,
  last_modified: null, // defined by the server
  last_modified_locally: null
}) {

  hasDefaultContent() {
    return Config.DEFAULT_CONTENT === this.content;
  }

  hasDefaultMetadata() {
    return Config.DEFAULT_METADATA === this.metadata;
  }

  hasNeverBeenSync() {
    return null === this.last_modified;
  }

  hasNoLocalChanges() {
    return null === this.last_modified_locally;
  }

  isNew() {
    return this.hasDefaultContent() && this.hasDefaultMetadata() && this.hasNeverBeenSync() && this.hasNoLocalChanges();
  }
}
