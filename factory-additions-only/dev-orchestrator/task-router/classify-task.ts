/**
 * classify-task.ts
 * Étant donné une tâche détectée, renvoie le risk_level + skills_required
 * en lisant risk-policy.yml.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

export type ClassifiedTask = {
  type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  skills_required: string[];
  approval_required: boolean;
};

export async function classifyTask(taskType: string): Promise<ClassifiedTask> {
  const policyPath = path.resolve('dev-orchestrator/task-router/risk-policy.yml');
  const policy = yaml.parse(await fs.readFile(policyPath, 'utf-8'));

  const risk_level = (policy.risk_by_type?.[taskType] ?? 'high') as ClassifiedTask['risk_level'];
  const routing = policy.routing?.[risk_level] ?? {};

  return {
    type: taskType,
    risk_level,
    skills_required: skillsForType(taskType),
    approval_required: !!routing.requires_approval_before_run,
  };
}

function skillsForType(type: string): string[] {
  const map: Record<string, string[]> = {
    add_test: ['spec-driven-execution', 'typescript-quality'],
    fix_typescript: ['karpathy-coding-loop'],
    add_loading_state: ['frontend-ui-quality'],
    add_error_state: ['frontend-ui-quality'],
    create_component: ['frontend-ui-quality', 'typescript-quality'],
    create_api_route: ['backend-pack-selector', 'security-reviewer'],
    create_worker: ['backend-pack-selector', 'security-reviewer'],
    feature_spec_from_url: ['spec-driven-execution', 'frontend-ui-quality'],
    n8n_workflow_draft: ['n8n-workflow-builder'],
    security_finding: ['security-reviewer'],
  };
  return map[type] ?? ['spec-driven-execution', 'security-reviewer'];
}
