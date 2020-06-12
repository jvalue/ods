<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="500px"
  >
    <v-card>
      <v-card-title>
        <span class="headline">Notification</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row
            cols="20"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="editedNotification.condition"
              label="Condition"
            />
          </v-row>
          <v-row
            cols="30"
            sm="6"
            md="4"
          >
            <v-select
              v-model="editedNotification.type"
              :items="notificationTypes"
              label="Type"
            />
          </v-row>
          <v-row
            cols="10"
            sm="6"
            md="4"
          >
            <webhook-edit
              v-if="editedNotification.type === 'WEBHOOK'"
              v-model="editedNotification"
              style="flex: 1 1 auto"
              @validityChanged="validForm = $event"
            />
            <firebase-edit
              v-if="editedNotification.type === 'FCM'"
              v-model="editedNotification"
              style="flex: 1 1 auto"
              @validityChanged="validForm = $event"
            />
            <slack-edit
              v-if="editedNotification.type === 'SLACK'"
              v-model="editedNotification"
              style="flex: 1 1 auto"
              @validityChanged="validForm = $event"
            />
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          class="ma-2"
          :disabled="!validForm"
          @click="onSave()"
        >
          Save
        </v-btn>
        <v-btn
          color="error"
          class="ma-2"
          @click="closeDialog()"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'
import { Emit } from 'vue-property-decorator'

import NotificationConfig, { WebhookNotification } from '@/notification/notificationConfig'
import NotificationEditDialog from '@/notification/notificationEditDialog'
import WebhookEdit from '@/notification/WebhookEdit.vue'
import FirebaseEdit from '@/notification/FirebaseEdit.vue'
import SlackEdit from '@/notification/SlackEdit.vue'

@Component({
  components: { SlackEdit, WebhookEdit, FirebaseEdit }
})
export default class NotificationEdit extends Vue implements NotificationEditDialog {
  private validForm = false;

  @Emit('save')
  onPipelineSave () {
    return this.editedNotification
  }

  private notificationTypes = ['WEBHOOK', 'FCM', 'SLACK']
  private dialogOpen = false

  private defaultNotification: WebhookNotification = {
    notificationId: -1,
    condition: 'true',
    url: '',
    type: 'WEBHOOK'
  }

  private editedNotification: NotificationConfig = Object.assign({}, this.defaultNotification)

  openDialog (notificationConfig?: NotificationConfig) {
    if (notificationConfig) { // edit
      this.editedNotification = Object.assign({}, notificationConfig)
    } else { // create
      this.editedNotification = Object.assign({}, this.defaultNotification)
    }
    this.dialogOpen = true
  }

  closeDialog () {
    this.editedNotification = Object.assign({}, this.defaultNotification)
    this.dialogOpen = false
  }

  onSave () {
    this.onPipelineSave()
    this.closeDialog()
  }
}

</script>
