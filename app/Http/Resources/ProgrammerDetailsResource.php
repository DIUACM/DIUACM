<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ProgrammerDetailsResource extends ProgrammerResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
       

        return array_merge(parent::toArray($request), [
            'atcoder_handle' => $this->atcoder_handle,
            'vjudge_handle' => $this->vjudge_handle,
        
        ]);
    }
}
