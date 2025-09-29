<?php

namespace Deployer;

require 'recipe/laravel.php';

// Config

set('repository', 'https://github.com/DIUACM/DIUACM.git');
set('writable_mode', 'chmod');
set('keep_releases', 5);

add('shared_files', []);
add('shared_dirs', []);
add('writable_dirs', []);

// Load environment variables
$hostname = getenv('DEPLOY_HOSTNAME');
$remoteUser = getenv('DEPLOY_REMOTE_USER');
$deployPath = getenv('DEPLOY_PATH');
$httpUser = getenv('DEPLOY_HTTP_USER');
$sshPort = getenv('DEPLOY_SSH_PORT');
$branch = getenv('DEPLOY_BRANCH') ?: 'main';

// Validate required environment variables
if (! $hostname) {
    throw new \RuntimeException('DEPLOY_HOSTNAME environment variable is required');
}
if (! $remoteUser) {
    throw new \RuntimeException('DEPLOY_REMOTE_USER environment variable is required');
}
if (! $deployPath) {
    throw new \RuntimeException('DEPLOY_PATH environment variable is required');
}
if (! $httpUser) {
    throw new \RuntimeException('DEPLOY_HTTP_USER environment variable is required');
}
if (! $sshPort) {
    throw new \RuntimeException('DEPLOY_SSH_PORT environment variable is required');
}

// Hosts

host($hostname)
    ->set('remote_user', $remoteUser)
    ->set('deploy_path', $deployPath)
    ->set('http_user', $httpUser)
    ->set('port', $sshPort)
    ->set('branch', $branch);

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
    $port = get('port');
    $releasePath = get('release_path');

    runLocally("scp -r -P {$port} public/build {$user}@{$hostname}:{$releasePath}/public/");
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
