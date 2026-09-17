import React from 'react';
import { ElicitationForm } from '../../elicitation/ElicitationForm';
import type { ElicitationRequestedSchema } from '../../elicitation/elicitation-schema';
import { PlanApproval } from '../../message-actions/PlanApproval/PlanApproval';
import type { PlanDecision } from '../../message-actions/types';
import type { Plan } from '../../tools/PlanTool';
import type { CustomToolRendererProps } from '../../types';
import { ELICITATION_TOOL, PLAN_APPROVAL_TOOL } from './demo-script';

type ElicitationInput = {
  serverName: string;
  message: string;
  requestedSchema: ElicitationRequestedSchema;
};

function ElicitationRenderer({ input, output, onAction }: CustomToolRendererProps) {
  const { serverName, message, requestedSchema } = input as ElicitationInput;
  return (
    <ElicitationForm
      serverName={serverName}
      message={message}
      requestedSchema={requestedSchema}
      disabled={output !== undefined}
      onAccept={(content) => onAction?.('accept', content)}
      onDecline={() => onAction?.('decline')}
      onCancel={() => onAction?.('cancel')}
    />
  );
}

function PlanApprovalRenderer({ input, output, onAction }: CustomToolRendererProps) {
  const { plan } = input as { plan: Plan };
  const decide = (decision: PlanDecision) => onAction?.('plan', decision);
  return (
    <PlanApproval
      plan={plan}
      decision={(output as PlanDecision | undefined) ?? null}
      onApprove={() => decide({ kind: 'approved' })}
      onApproveWithEdits={(edits) => decide({ kind: 'approved-with-edits', edits })}
      onReject={(feedback) => decide({ kind: 'rejected', feedback })}
    />
  );
}

export const DEMO_TOOL_RENDERERS: Record<string, React.ComponentType<CustomToolRendererProps>> = {
  [`tool-${ELICITATION_TOOL}`]: ElicitationRenderer,
  [`tool-${PLAN_APPROVAL_TOOL}`]: PlanApprovalRenderer,
};
