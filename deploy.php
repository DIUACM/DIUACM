<?php
namespace Deployer;

require 'recipe/laravel.php';

// Config

set('repository', 'https://github.com/DIUACM/DIUACM.git');
set('writable_mode', 'chmod');

add('shared_files', []);
add('shared_dirs', []);
add('writable_dirs', []);

// Hosts

host('deploy.diuacm.com')
    ->set('remote_user', 'diuacmc1')
    ->set('deploy_path', '/home/diuacmc1/deploy.diuacm.com')
    ->set('http_user', 'diuacmc1');

// Hooks

after('deploy:failed', 'deploy:unlock');
