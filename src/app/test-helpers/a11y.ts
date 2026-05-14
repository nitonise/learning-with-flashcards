import axe, { AxeResults } from 'axe-core';

export async function expectNoAxeViolations(element: Element): Promise<void> {
  const results = await axe.run(element);
  expect(formatViolations(results)).toEqual([]);
}

function formatViolations(results: AxeResults): string[] {
  return results.violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
    return `${violation.id}: ${violation.help} (${targets})`;
  });
}
