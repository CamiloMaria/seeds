import {
	VALID_EXECUTION_CAPABILITIES,
	type ExecutionCapability,
	type ExecutionMetadata,
} from "./types.ts";

type FlagValue = string | boolean | undefined;

function normalizeOptionalString(value: FlagValue): string | undefined {
	if (value === undefined || value === false) return undefined;
	if (value === true) return undefined;
	const trimmed = String(value).trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function parseBooleanFlag(value: FlagValue, flagName: string): boolean | undefined {
	if (value === undefined) return undefined;
	if (value === true) return true;
	if (value === false) return false;

	const normalized = String(value).trim().toLowerCase();
	if (normalized === "true") return true;
	if (normalized === "false") return false;
	throw new Error(`${flagName} must be true or false`);
}

function parseFileScope(value: FlagValue): string[] | undefined {
	const normalized = normalizeOptionalString(value);
	if (!normalized) return undefined;
	const parsed = normalized
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
	return parsed.length > 0 ? parsed : undefined;
}

function isExecutionCapability(value: string): value is ExecutionCapability {
	return (VALID_EXECUTION_CAPABILITIES as readonly string[]).includes(value);
}

export function validateExecutionMetadata(
	execution: ExecutionMetadata,
	context: string,
): string[] {
	const details: string[] = [];

	if (
		execution.capability !== undefined &&
		!(VALID_EXECUTION_CAPABILITIES as readonly string[]).includes(execution.capability)
	) {
		details.push(
			`${context}.execution.capability: invalid capability '${execution.capability}'`,
		);
	}

	if (execution.fileScope !== undefined) {
		if (
			!Array.isArray(execution.fileScope) ||
			execution.fileScope.some((item) => typeof item !== "string" || item.trim().length === 0)
		) {
			details.push(`${context}.execution.fileScope: must be an array of non-empty strings`);
		}
	}

	if (
		execution.reviewRequired !== undefined &&
		typeof execution.reviewRequired !== "boolean"
	) {
		details.push(`${context}.execution.reviewRequired: must be a boolean`);
	}

	if (execution.swarmable !== undefined && typeof execution.swarmable !== "boolean") {
		details.push(`${context}.execution.swarmable: must be a boolean`);
	}

	if (
		execution.runtime !== undefined &&
		(typeof execution.runtime !== "string" || execution.runtime.trim().length === 0)
	) {
		details.push(`${context}.execution.runtime: must be a non-empty string`);
	}

	if (
		execution.profile !== undefined &&
		(typeof execution.profile !== "string" || execution.profile.trim().length === 0)
	) {
		details.push(`${context}.execution.profile: must be a non-empty string`);
	}

	return details;
}

export function parseExecutionFlags(
	flags: Record<string, FlagValue>,
): { execution?: ExecutionMetadata; clearExecution: boolean } {
	const clearExecution = flags["clear-execution"] === true;
	const capability = normalizeOptionalString(flags.capability);
	const fileScope = parseFileScope(flags.files);
	const runtime = normalizeOptionalString(flags.runtime);
	const profile = normalizeOptionalString(flags.profile);
	const reviewRequired = parseBooleanFlag(flags["review-required"], "--review-required");
	const swarmable = parseBooleanFlag(flags.swarmable, "--swarmable");

	const execution: ExecutionMetadata = {};

	if (capability !== undefined) {
		if (!isExecutionCapability(capability)) {
			throw new Error(
				`--capability must be one of: ${VALID_EXECUTION_CAPABILITIES.join(", ")}`,
			);
		}
		execution.capability = capability;
	}
	if (fileScope !== undefined) execution.fileScope = fileScope;
	if (reviewRequired !== undefined) execution.reviewRequired = reviewRequired;
	if (swarmable !== undefined) execution.swarmable = swarmable;
	if (runtime !== undefined) execution.runtime = runtime;
	if (profile !== undefined) execution.profile = profile;

	return {
		execution: Object.keys(execution).length > 0 ? execution : undefined,
		clearExecution,
	};
}
