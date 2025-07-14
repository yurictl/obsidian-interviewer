import InterviewerPlugin from '../main';

function getPlugin(): any {
  return new InterviewerPlugin({} as any, {} as any);
}

describe('utility functions', () => {
  test('escapeRegExp escapes special characters', () => {
    const plugin: any = getPlugin();
    const escape = plugin['escapeRegExp'] as (s: string) => string;
    expect(escape('a+b*c')).toBe('a\\+b\\*c');
  });

  test('createInteractiveQuestion returns details format', () => {
    const plugin: any = getPlugin();
    const create = plugin['createInteractiveQuestion'] as (
      q: string,
      a: string,
      ca: string,
      diff: string,
      idx: number
    ) => string;
    const result = create.call(
      plugin,
      'What is Docker?',
      'Docker is a containerization technology.',
      '',
      'easy',
      0
    );
    expect(result).toBe(
      '<details class="interview-question" data-id="what-is-docker-0" data-difficulty="easy">\n  <summary>\n    <span class="q-text">What is Docker?</span>\n    <span class="badge diff-easy">easy</span>\n  </summary>\n\n  <div class="canonical-answer">\nDocker is a containerization technology.</div>\n\n  <div class="candidate-answer empty"></div>\n</details>'
    );
  });

  test('createInteractiveQuestion adds candidate answer when provided', () => {
    const plugin: any = getPlugin();
    const create = plugin['createInteractiveQuestion'] as any;
    const result = create.call(
      plugin,
      'Explain Git',
      'Version control system.',
      'Candidate mentioned SVN too.',
      'medium',
      1
    );
    expect(result).toBe(
      '<details class="interview-question" data-id="explain-git-1" data-difficulty="medium">\n  <summary>\n    <span class="q-text">Explain Git</span>\n    <span class="badge diff-medium">medium</span>\n  </summary>\n\n  <div class="canonical-answer">\nVersion control system.</div>\n\n  <div class="candidate-answer">Candidate mentioned SVN too.</div>\n</details>'
    );
  });
});
