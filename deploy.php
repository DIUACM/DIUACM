<?php

namespace Deployer;

require 'recipe/laravel.php';

// Config

set('repository', 'https://github.com/DIUACM/DIUACM.git');
set('writable_mode', 'chmod');

add('shared_files', []);
add('shared_dirs', []);
add('writable_dirs', []);

// Load environment variables
$hostname = getenv('DEPLOY_HOSTNAME') ?: 'deploy.diuacm.com';
$remoteUser = getenv('DEPLOY_REMOTE_USER') ?: 'diuacmc1';
$deployPath = getenv('DEPLOY_PATH') ?: '/home/diuacmc1/deploy.diuacm.com';
$httpUser = getenv('DEPLOY_HTTP_USER') ?: 'diuacmc1';

// Hosts

host($hostname)
    ->set('remote_user', $remoteUser)
    ->set('deploy_path', $deployPath)
    ->set('http_user', $httpUser);

// Tasks

// Build assets locally
task('build:assets', function () {
    writeln('Building assets locally...');
    runLocally('npm ci');
    runLocally('npm run build');
})->desc('Build assets locally');

// Upload built assets
task('upload:assets', function () {
    writeln('Uploading built assets...');
    $user = get('remote_user');
    $hostname = currentHost()->getHostname();
    $releasePath = get('release_path');

    runLocally("scp -r public/build {$user}@{$hostname}:{$releasePath}/public/");
})->desc('Upload built assets to server');

// Skip npm tasks on server by overriding them
task('deploy:npm', function () {
    writeln('Skipping npm install on server (assets built locally)');
});

// Hooks

// Build assets locally before deployment starts
before('deploy', 'build:assets');

// Upload assets after the release is prepared but before going live
after('deploy:vendors', 'upload:assets');

after('deploy:failed', 'deploy:unlock');
