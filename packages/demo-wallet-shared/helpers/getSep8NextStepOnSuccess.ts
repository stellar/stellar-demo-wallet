import { Sep8ApprovalStatus, Sep8Step } from "../types/types";

/**
 * Returns the next SEP-8 step to be displayed after the current step succeeds.
 *
 * @param {Sep8Step} currentStep the current SEP-8 step.
 * @param {Sep8ApprovalStatus} [approvalStatus] the approval status returned
 * from the SEP-8 server. This value will only be used if
 * `currentStep === Sep8Step.STARTING`.
 * @returns {Sep8Step} the next SEP-8 step for the application.
 */
export const getSep8NextStepOnSuccess = ({
  currentStep,
  approvalStatus,
  didUndergoKyc,
}: {
  currentStep: Sep8Step;
  approvalStatus?: Sep8ApprovalStatus;
  didUndergoKyc?: boolean;
}): Sep8Step => {
  const nextStepDict: { [key in Sep8Step]: Sep8Step } = {
    [Sep8Step.DISABLED]: Sep8Step.STARTING,
    [Sep8Step.STARTING]: nextStepAfterApprovalServer({
      currentStep,
      approvalStatus,
    }),
    [Sep8Step.PENDING]: Sep8Step.DISABLED,
    [Sep8Step.TRANSACTION_REVISED]: Sep8Step.COMPLETE,
    [Sep8Step.ACTION_REQUIRED]: Sep8Step.SENT_ACTION_REQUIRED_FIELDS,
    [Sep8Step.SENT_ACTION_REQUIRED_FIELDS]: didUndergoKyc
      ? nextStepAfterApprovalServer({
          currentStep,
          approvalStatus,
        })
      : Sep8Step.STARTING,
    [Sep8Step.COMPLETE]: Sep8Step.DISABLED,
  };

  return nextStepDict[currentStep];
};

/**
 * Returns the next SEP-8 step to be displayed after the current step succeeds,
 * based solely on the respone comming from the SEP-8 approval server.
 *
 * @param {Sep8Step} currentStep the current SEP-8 step.
 * @param {Sep8ApprovalStatus} [approvalStatus] the approval status returned
 * from the SEP-8 server. This value will only be used if
 * `currentStep === Sep8Step.STARTING`.
 * @returns {Sep8Step} the next SEP-8 step for the application.
 */
const nextStepAfterApprovalServer = ({
  currentStep,
  approvalStatus,
}: {
  currentStep: Sep8Step;
  approvalStatus?: Sep8ApprovalStatus;
}) => {
  const approvalStatusDict: { [key in Sep8ApprovalStatus]: Sep8Step } = {
    [Sep8ApprovalStatus.ACTION_REQUIRED]: Sep8Step.ACTION_REQUIRED,
    [Sep8ApprovalStatus.PENDING]: Sep8Step.PENDING,
    [Sep8ApprovalStatus.REVISED]: Sep8Step.TRANSACTION_REVISED,
    [Sep8ApprovalStatus.SUCCESS]: Sep8Step.TRANSACTION_REVISED,
    [Sep8ApprovalStatus.REJECTED]: currentStep,
  };
  return approvalStatusDict[approvalStatus!];
};
