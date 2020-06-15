/**
 * Identifier for notification type.
 * 
 */
enum notificationType{
    SLACK,
    WEBHOOK,
    FCM
}

/**
 * This will be sent to the notification queue 
 * (if the condition evaluation for a notification is met)
 */
export interface ConditionEvaluationResult{
    notificationType: notificationType  
    notificationID: number
}