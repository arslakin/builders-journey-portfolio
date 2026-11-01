import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { certificationRecords } from '../content/certifications.ts';
import { placeholderProjectLinkLabel, requiredProjectNames } from '../domain/project.ts';
import { App } from './App.tsx';

function commandShortcuts(): HTMLElement {
  const shortcuts = document.querySelector<HTMLElement>('.command-shortcuts');
  if (shortcuts === null) {
    throw new Error('Expected the command shortcut group.');
  }
  return shortcuts;
}

describe('App structure and unresolved content', () => {
  it('renders exact identity, semantic landmarks, sections, and honest pending states', () => {
    render(<App />);

    const levelOneHeadings = screen.getAllByRole('heading', { level: 1 });
    expect(levelOneHeadings).toHaveLength(1);
    expect(levelOneHeadings[0]?.textContent).toBe(
      "The Builder's Journey — From Teaching to Technology",
    );

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();

    for (const heading of [
      'About',
      'Skills / Tech Superpowers',
      'Projects / Achievements',
      'Discover My Superpower',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).toBeTruthy();
    }

    expect(screen.getAllByText('Azad Akin Arslan').length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        'AWS Student Builder Challenge: Build Your Tech Superpower',
      ),
    ).toBeTruthy();

    for (const name of requiredProjectNames) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeTruthy();
    }

    expect(
      screen.getByRole('heading', { level: 3, name: 'Certifications' }),
    ).toBeTruthy();
    for (const record of certificationRecords) {
      expect(
        screen.getByRole('heading', { level: 4, name: record.name.value }),
      ).toBeTruthy();
    }
    const ckaLink = screen.getByRole('link', {
      name: /Verify CKA status with Credly/,
    });
    expect(ckaLink.getAttribute('href')).toBe(
      'https://www.credly.com/go/Wr5GF1fB',
    );
    const udacityLink = screen.getByRole('link', {
      name: /Verify course completion with Udacity/,
    });
    expect(udacityLink.getAttribute('href')).toBe(
      'https://www.udacity.com/certificate/e/cb982b6e-3278-11f1-8e93-c320b758d7f5',
    );
    expect(
      screen.getByText(/not the AWS Certified AI Practitioner certification/),
    ).toBeTruthy();

    expect(screen.getAllByText(placeholderProjectLinkLabel)).toHaveLength(6);
    expect(
      screen.queryByRole('link', { name: placeholderProjectLinkLabel }),
    ).toBeNull();
    expect(
      screen.getByText('Deployment verified on AWS Amplify Hosting.'),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Open the live portfolio' }).getAttribute(
        'href',
      ),
    ).toBe('https://production.de88a9ko9s0fe.amplifyapp.com/');
  });
});

describe('App interactions', () => {
  it('operates the command explorer locally and preserves prior results', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole('textbox', { name: 'Command' });
    const submit = screen.getByRole('button', { name: 'Run command' });
    const output = screen.getByTestId('command-output');
    const shortcuts = within(commandShortcuts()).getAllByRole('button');

    expect(shortcuts).toHaveLength(5);
    expect(shortcuts.map((button) => button.textContent)).toEqual([
      'help',
      'journey',
      'skills',
      'projects',
      'superpower',
    ]);

    await user.type(input, 'help');
    await user.click(submit);
    expect(document.activeElement).toBe(input);
    expect(within(output).getByRole('heading', { name: 'Available commands' })).toBeTruthy();
    expect(output.textContent).toContain('List the available commands.');

    await user.clear(input);
    await user.type(input, '<img src=x onerror=alert(1)>');
    await user.click(submit);
    expect(output.textContent).toContain(
      'Unsupported command: <img src=x onerror=alert(1)>',
    );
    expect(within(output).getByRole('heading', { name: 'Available commands' })).toBeTruthy();
    expect(output.querySelector('img')).toBeNull();

    await user.clear(input);
    await user.click(submit);
    expect(output.textContent).toContain('Enter a command or choose a shortcut.');
    expect(within(output).getByRole('heading', { name: 'Available commands' })).toBeTruthy();
    expect(document.activeElement).toBe(input);

    await user.click(
      within(commandShortcuts()).getByRole('button', {
        name: 'Run journey command',
      }),
    );
    const commandJourney = within(output);
    const aiButton = commandJourney.getByRole('button', { name: /AI/ });
    await user.click(aiButton);
    expect(aiButton.getAttribute('aria-pressed')).toBe('true');
    expect(output.textContent).toContain('Active stage: AI');
    expect(output.textContent).toContain('I am developing AI and learning projects');

    await user.click(
      within(commandShortcuts()).getByRole('button', {
        name: 'Run superpower command',
      }),
    );
    expect(output.textContent).toContain(
      'My superpower is making complex ideas understandable',
    );
    expect(output.textContent).not.toContain('Active stage: AI');
    expect(document.activeElement).toBe(input);
  });

  it('closes mobile navigation on Escape and selection while restoring focus', async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = screen.getByRole('button', {
      name: 'Open primary navigation',
    });
    const panel = document.getElementById('mobile-navigation-panel');
    if (!(panel instanceof HTMLElement)) {
      throw new Error('Expected the mobile navigation panel.');
    }

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);

    await user.keyboard('{Escape}');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(toggle);

    await user.click(toggle);
    await user.click(
      within(panel).getByRole('link', { name: 'Skills / Tech Superpowers' }),
    );
    expect(panel.hidden).toBe(true);
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Skills / Tech Superpowers',
      }),
    ).toBe(document.activeElement);
    expect(window.location.hash).toBe('#skills');
  });
});
