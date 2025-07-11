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

  test('createInteractiveQuestion returns callout format', () => {
    const plugin: any = getPlugin();
    const create = plugin['createInteractiveQuestion'] as (
      q: string,
      a: string,
      ca: string,
      diff: string
    ) => string;
    const result = create(
      'What is Docker?',
      'Docker is a containerization technology.',
      '',
      'easy'
    );
    expect(result).toBe(
      '\n> [!question]- 🟢 What is Docker?\n> Docker is a containerization technology.'
    );
  });

  test('createInteractiveQuestion adds candidate answer when provided', () => {
    const plugin: any = getPlugin();
    const create = plugin['createInteractiveQuestion'] as any;
    const result = create(
      'Explain Git',
      'Version control system.',
      'Candidate mentioned SVN too.',
      'medium'
    );
    expect(result).toBe(
      '\n> [!question]- 🟡 Explain Git\n> Version control system.\n> @candidate\n> Candidate mentioned SVN too.\n>'
    );
  });

  test('createInteractiveQuestion handles multiline candidate answer', () => {
    const plugin: any = getPlugin();
    const create = plugin['createInteractiveQuestion'] as any;
    const result = create(
      'Explain CI/CD',
      'Continuous Integration and Deployment.',
      'Line one.\nLine two.',
      'medium'
    );
    expect(result).toBe(
      '\n> [!question]- 🟡 Explain CI/CD\n> Continuous Integration and Deployment.\n> @candidate\n> Line one.\n> Line two.\n>'
    );
  });
});
