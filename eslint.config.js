import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import css from '@eslint/css';
import globals from 'globals';
import react from 'eslint-plugin-react';
//import reactHooks from 'eslint-plugin-react-hooks';


export default defineConfig([
   {
      files: ['**/*.{js,jsx,mjs,cjs}'],
      plugins: { js },
      extends: ['js/recommended'],
      languageOptions: {
         globals: {
            ...globals.browser
         },
         ecmaVersion: 2022,
         sourceType: 'module'
      },
      rules: {
         indent: ['error', 3, {
            ignoreComments: true,
            SwitchCase: 1
         }],
         'linebreak-style': ['error', 'unix'],
         quotes: ['error', 'single'],
         semi: ['error', 'always'],
         eqeqeq: 'error',
         'no-trailing-spaces': ['warn', {
            ignoreComments: true
         }],
         'arrow-spacing': ['error', {
            before: true,
            after: true
         }],
         'no-unused-vars': ['warn', {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_'
         }],
         'object-curly-spacing': ['error', 'always'],
         'no-constant-condition': ['warn', {
            checkLoops: false
         }]
      }
   },

   {
      files: ['**/*.{js,jsx}'],
      plugins: { react },
      languageOptions: {
         parserOptions: {
            ecmaFeatures: {
               jsx: true
            }
         }
      },
      settings: {
         react: {
            version: 'detect'
         }
      },
      rules: {
         ...react.configs.flat.recommended.rules,
         // React 17+ does not require React import
         'react/react-in-jsx-scope': 'off',
         // Allow "data_testid" attribute that is used by React Testing Library
         'react/no-unknown-property': ['error', {
            ignore: ['data-testid']
         }],
         'react/prop-types': 'off'
      }
   },

   // TODO: Take in use
   //
   //{
   //   files: ['**/*.{js,jsx}'],
   //   ...reactHooks.configs.flat.recommended
   //},

   {
      files: ['**/*.css'],
      plugins: { css },
      language: 'css/css',
      languageOptions: {
         /* This is necessary as of @eslint/css version 0.11.0. Otherwise certain nested selectors causes
         parsing of the CSS file to fail: https://github.com/eslint/css/issues/123#issuecomment-2850614742 */
         tolerant: true
      },
      extends: ['css/recommended'],
      rules: {
         'css/use-baseline': ['error', {
            allowProperties: [
               // Always used together with -webkit-user-select
               'user-select',
               // Used in @supports at rules for Firefox
               'scrollbar-color',
               // Used to provide stable scrollbars with Chrome, not critical if does not work
               'scrollbar-gutter',
               // Not supported on mobile browsers
               'resize'
            ],
            allowSelectors: ['nesting']
         }],
         'css/no-invalid-properties': ['error', {
            allowUnknownVariables: true
         }]
      }
   },
]);