import {Record} from 'immutable';
import {Config} from './Config';
import uuid from 'uuid';
import isEqual from 'lodash.isequal';

export default class Document extends Record({
  uuid: uuid.v4(),
  path: null,
  content: Config.DEFAULT_CONTENT,
  metadata: Config.DEFAULT_METADATA,
  last_modified: null, // defined by the server
  last_modified_locally: null,
  userPref: Config.DEFAULT_USERPREF,
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

  hasDefaultUserPref() {
    return isEqual(Config.DEFAULT_USERPREF, this.userPref);
  }

  isNew() {
    return this.hasDefaultUserPref() && this.hasDefaultContent() && this.hasDefaultMetadata() && this.hasNeverBeenSync() && this.hasNoLocalChanges();
  }
}
