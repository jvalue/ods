<template>
  <div class="notification">
    <v-card>
      <v-card-title>
        <notification-edit
          ref="notificationEdit"
          @save="onSave"
        />
        <v-btn
          class="ma-2"
          @click="onNavigateBack()"
        >
          <v-icon
            dark
            right
          >
            mdi mdi-arrow-left
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          color="success"
          @click="onCreateNotification()"
        >
          Add notification
          <v-icon
            dark
            right
          >
            mdi mdi-alarm
          </v-icon>
        </v-btn>
        <v-btn
          class="ma-2"
          @click="onLoadNotifications()"
        >
          <v-icon dark>
            mdi mdi-sync
          </v-icon>
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="notifications"
        :loading="isLoadingNotifications"
        class="elevation-1"
      >
        <v-progress-linear
          slot="progress"
          indeterminate
        />
        <template v-slot:item.id="{ item }">
          {{ item.id }}
        </template>
        <template v-slot:item.type="{ item }">
          {{ item.type }}
        </template>
        <template v-slot:item.condition="{ item }">
          {{ item.condition }}
        </template>
         <template v-slot:item.id="{ item }">
          {{ item.id }}
        </template>
        <template v-slot:item.action="{ item }">
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onEditNotification(item)"
          >
            Edit
            <v-icon
              dark
              right
            >
              mdi-pencil
            </v-icon>
          </v-btn>
          <v-btn
            depressed
            small
            class="ma-2"
            @click="onDeleteNotification(item)"
          >
            Delete
            <v-icon
              dark
              right
            >
              mdi-delete
            </v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'
import { Action, State } from 'vuex-class'
import { Ref } from 'vue-property-decorator'

import Pipeline from '@/pipeline/pipeline'
import NotificationConfig from '@/notification/notificationConfig'
import NotificationEditDialog from '@/notification/notificationEditDialog'
import NotificationEdit from '@/notification/NotificationEdit.vue'
import * as RestClient from '@/notification/notificationRest'

const pipelineNameSpace = { namespace: 'pipeline' }
const notificationNameSpace = {namespace: 'notification'}

@Component({
  components: {
    NotificationEdit: NotificationEdit
  }
})
export default class PipelineNotifications extends Vue {
  // @Action('loadPipelineById', pipelineNameSpace) 
  // private loadPipelineByIdAction!: (id: number) => void

  @Action('loadConfigsbyPipelineId', notificationNameSpace) 
  private loadConfigbyPipelineIdAction!: (id: number) => void

  @Action('addNotification', notificationNameSpace)
  private addNotificationAction!: (notification: NotificationConfig) => Promise<NotificationConfig[]>

  @Action('removeNotification', notificationNameSpace)
  private removeNotificationAction!: (notification: NotificationConfig) => Promise<NotificationConfig[]>

  @Action('updateNotification', notificationNameSpace)
  private updateNotificationAction!: (notification: NotificationConfig) => Promise<NotificationConfig[]>

  //@State('selectedPipeline', pipelineNameSpace) private selectedPipeline!: Pipeline
  @State('notifications', notificationNameSpace) private notifications: NotificationConfig[] = []
  @State('isLoadingNotifications', notificationNameSpace) private isLoadingNotifications!: boolean;

  @Ref('notificationEdit')
  private notificationEdit!: NotificationEditDialog

  headers = [
    { text: 'Id', value: 'id' },
    { text: 'Type', value: 'type' },
    { text: 'Condition', value: 'condition' },
    { text: 'Actions', value: 'action' }
  ]

  private isEdit = false
  private pipelineId = -1

  private async created () {
    console.log('Notification Overview created!')
    this.pipelineId = this.$route.params.pipelineId as unknown as number
    //await this.onLoadNotifications()
    //this.loadPipelineByIdAction(this.pipelineId)
    this.loadConfigbyPipelineIdAction(this.pipelineId)
  }

  private onCreateNotification () {
    this.isEdit = false
    this.notificationEdit.openDialog()
  }

  private async onEditNotification (notification: NotificationConfig) {
    this.isEdit = true
    this.notificationEdit.openDialog(notification)
  }

  private async onDeleteNotification (notification: NotificationConfig) {
     this.removeNotificationAction(notification)
    //await RestClient.remove(notification)
    //await this.onLoadNotifications()
  }

  private async onLoadNotifications () {
    //this.loadPipelineByIdAction(this.pipelineId)
    //this.notifications = await RestClient.getAllByPipelineId(this.pipelineId)
    await this.loadConfigbyPipelineIdAction(this.pipelineId)
  }

  private onNavigateBack () {
    this.$router.push({ name: 'pipeline-overview' })
  }   

  private async onSave (editedNotification: NotificationConfig) {
    editedNotification.pipelineId = this.pipelineId
    
    if (this.isEdit) { // edit
      this.updateNotificationAction(editedNotification)
      //await RestClient.update(editedNotification)
    } else { // create
      this.addNotificationAction(editedNotification)
      //await RestClient.create(editedNotification)
    }
 
    await this.onLoadNotifications()
  }
}
</script>
