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
              v-model="editedNotification.notificationType"
              :items="notificationTypes"
              label="Type"
            />
          </v-row>
          <v-row
            cols="10"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="editedNotification.url"
              label="URL"
            />
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          class="ma-2"
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
import NotificationConfig, { NotificationType } from '@/pipeline/notificationConfig'
import NotificationEditDialog from '@/pipeline/notificationEditDialog'
import { Emit, Prop } from 'vue-property-decorator'

@Component({})
export default class PipelineNotifications extends Vue implements NotificationEditDialog {
  @Emit('pipelineSaved')
  onPipelineSave () {
    return this.editedNotification
  }

  private notificationTypes = ['WEBHOOK']
  private dialogOpen = false

  private defaultNotification: NotificationConfig = {
    notificationId: -1,
    notificationType: NotificationType.WEBHOOK,
    condition: '',
    url: ''
  }

  private editedNotification: NotificationConfig = Object.assign({}, this.defaultNotification)

  openDialog (notifcationConfig?: NotificationConfig) {
    if (notifcationConfig) { // edit
      this.editedNotification = Object.assign({}, notifcationConfig)
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
