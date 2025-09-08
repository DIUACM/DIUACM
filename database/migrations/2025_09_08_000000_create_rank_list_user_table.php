<?php

use App\Models\RankList;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rank_list_user', function (Blueprint $table) {
            $table->foreignIdFor(RankList::class)->constrained('rank_lists')->cascadeOnDelete();
            $table->foreignIdFor(User::class)->constrained('users')->cascadeOnDelete();
            $table->float('score')->default(0);

            $table->unique(['rank_list_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rank_list_user');
    }
};
